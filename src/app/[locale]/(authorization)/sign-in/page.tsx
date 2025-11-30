import SulikoForm from "@/shared/components/SulikoForm";
import SulikoFormBanner from "@/shared/components/SulikoFormBanner";
import SulikoLogo from "@/shared/components/SulikoLogo";
import { Link } from "@/i18n/navigation";

export default function SignIn() {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-center items-start min-h-screen w-full overflow-y-auto">
      <div className="flex relative items-start sm:w-[50%] w-full justify-center sm:min-h-screen py-4 sm:py-0">
        <Link href="/">
          <SulikoLogo
            className="absolute z-1000 sm:block top-[20px] left-[20px] cursor-pointer"
            width={100}
          />
        </Link>
        <SulikoForm />
      </div>
      <SulikoFormBanner />
    </div>
  );
} 