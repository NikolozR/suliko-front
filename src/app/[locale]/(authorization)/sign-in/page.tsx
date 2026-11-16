import SulikoForm from "@/shared/components/SulikoForm";
import AuroraBackground from "@/shared/components/AuroraBackground";
import CrispChatButton from "@/shared/components/CrispChatButton";

export default function SignIn() {
  return (
    <div className="relative flex justify-center items-center min-h-[100dvh] w-full overflow-y-auto">
      <AuroraBackground />
      <div className="relative flex items-center justify-center w-full min-h-[100dvh]">
        <SulikoForm />
      </div>
      <CrispChatButton />
    </div>
  );
}
