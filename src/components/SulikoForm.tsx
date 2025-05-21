"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import SulikoFormParticles from "./SulikoFormParticles";
import { register } from "@/services/authorizationService";
import ErrorAlert from "./ErrorAlert";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  mobile: z
    .string()
    .min(1, { message: "Mobile number is required" })
    .regex(/^5\d{8}$/, "Mobile number must be in Georgian format: 5XXXXXXXX"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 6 characters long" })
    .regex(
      /(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
      "Password must contain at least one digit and one symbol"
    ),
});

const SulikoForm: React.FC = () => {
  const { setToken, setRefreshToken } = useAuthStore();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobile: "",
      password: "",
    },
  });
  const router = useRouter();

  function togglePasswordVisibility() {
    setIsPasswordVisible((prev) => !prev);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setAuthError(null);
    try {
      const data = await register({
        phoneNumber: values.mobile,
        password: values.password,
      });
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      router.push("/");
    } catch {
      setAuthError("Authentication failed, Invalid credentials");
    }
  }

  return (
    <>
      <SulikoFormParticles />
      <Form {...form}>
        <div className="flex z-10 flex-col my-[110px] sm:mt-0 justify-center items-center w-full h-full">
          <div className="pb-[20px] lg:pb-[40px] flex flex-col gap-5 overflow-hidden">
            <h3 className="lg:text-4xl text-2xl text-suliko-default-color font-bold text-center dark:text-primary">
              ავტორიზაცია
            </h3>
            <p className="text-center px-[10px] text-[0.8rem] lg:text-[1rem] dark:text-muted-foreground">
              შეიყვანეთ თქვენი ტელეფონის ნომერი და პაროლი
            </p>
          </div>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-8 w-[60%]"
          >
            {authError && (
              <ErrorAlert
                message={authError}
                onClose={() => setAuthError(null)}
              />
            )}
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold dark:text-white">ტელეფონი</FormLabel>
                  <FormControl>
                    <Input placeholder="5XX 11 22 33" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold dark:text-white">პაროლი</FormLabel>
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        className=""
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="********"
                        {...field}
                      />
                      {isPasswordVisible ? (
                        <Eye
                          size={25}
                          className="absolute cursor-pointer right-0 top-[50%] translate-[-50%]"
                          onClick={togglePasswordVisibility}
                        />
                      ) : (
                        <EyeOff
                          size={25}
                          className="absolute cursor-pointer right-0 top-[50%] translate-[-50%]"
                          onClick={togglePasswordVisibility}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="bg-suliko-default-color cursor-pointer hover:bg-suliko-default-hover-color dark:text-white"
              type="submit"
            >
              რეგისტრაცია
            </Button>
          </form>
        </div>
      </Form>
    </>
  );
};

export default SulikoForm;
