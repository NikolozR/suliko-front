import SulikoForm from "@/shared/components/SulikoForm";
import SulikoFormBanner from "@/shared/components/SulikoFormBanner";
import SulikoLogo from "@/shared/components/SulikoLogo";
import { Link } from "@/i18n/navigation";

export default function SignIn() {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-center items-center h-screen">
      <div className="flex relative items-center sm:w-[50%] w-full justify-center sm:h-screen">
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