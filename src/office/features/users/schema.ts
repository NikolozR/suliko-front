// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { z } from "zod";
import { isPhone } from "@office/shared/lib/phone";

/**
 * Staff membership form validation.
 *
 * Mirrors `UserInvite` / `UserUpdate` in `api/v1/users.py`. There is no
 * password anywhere here: a password belongs to the person's account, which
 * no organisation sets — people are invited and choose their own.
 *
 * Messages are catalogue keys under `validation` — optionally `key:param` —
 * translated by `validationFailed` in the reader's language.
 */

/**
 * Roles this form may assign; labels are `users.roles.<role>`.
 *
 * `superuser` is absent on purpose: it is platform-level, only the server
 * console creates it, and the API rejects it here. Offering it in a dropdown
 * would be offering something that cannot work.
 */
export const ASSIGNABLE_ROLES = ["owner", "admin", "manager", "staff"] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const fullName = z.string().trim().min(1, "fullName").max(255, "maxChars:255");
const email = z.email("email").max(255, "maxChars:255");

/**
 * Update accepts no username, no email and no password.
 *
 * Username is the audit-trail handle and is deliberately immutable; the email
 * and password are the person's account's, which only they change.
 */
export const userUpdateSchema = z.object({
  full_name: fullName,
  position: z.string().trim().max(100, "maxChars:100").optional(),
  phone: z
    .string()
    .trim()
    .max(50, "maxChars:50")
    .refine((value) => !value || isPhone(value), "phone")
    .optional(),
  role: z.enum(ASSIGNABLE_ROLES),
  is_active: z.boolean(),
});

export type UserUpdateValues = z.infer<typeof userUpdateSchema>;

/**
 * The invite form.
 *
 * No password field: nobody invents one for somebody else. The invitee's
 * password is the one on suliko.ge (or, where Office is not connected to it,
 * one they choose from a single-use emailed link).
 *
 * `permissions` is the WHOLE set the person should end up with. The API turns
 * it into a difference against the role's bundle; sending the set keeps the
 * form honest, because what the owner ticked is what they get.
 */
export const userInviteSchema = z
  .object({
    full_name: fullName,
    /** Who to invite, by address. Left out when they are invited by `phone`. */
    email: email.optional(),
    position: z.string().trim().max(100, "maxChars:100").optional(),
    /**
     * Their phone number. With no `email` it is also WHO is invited: someone
     * who registered on suliko.ge with a phone number has no address.
     */
    phone: z
      .string()
      .trim()
      .max(50, "maxChars:50")
      .refine((value) => !value || isPhone(value), "phone")
      .optional(),
    role: z.enum(ASSIGNABLE_ROLES),
    permissions: z.array(z.string()),
    /**
     * Someone picked from the suggestions. Stands in for the address or number,
     * which the browser never held: the API uses the sign-in name it has.
     */
    suliko_user_id: z.string().trim().max(64).optional(),
  })
  .superRefine((value, context) => {
    // Mirrors `UserInvite` in the API: an address, or else a real phone number,
    // or a person picked from suliko.ge. Reported on `email`, which is where
    // the search box shows its errors.
    if (value.suliko_user_id) return;
    if (!value.email && (value.phone ?? "").replace(/\D/g, "").length < 6) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "emailOrPhone",
      });
    }
  });

export type UserInviteValues = z.infer<typeof userInviteSchema>;

export type UserFieldErrors = Partial<
  Record<keyof UserInviteValues | "is_active", string[]>
>;
