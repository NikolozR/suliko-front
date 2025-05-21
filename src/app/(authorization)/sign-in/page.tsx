import SulikoForm from "@/components/SulikoForm";
import SulikoFormBanner from "@/components/SulikoFormBanner";
import SulikoLogo from "@/components/SulikoLogo";


export default function SignIn() {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-center items-center h-screen">
      <div className="flex relative items-center sm:w-[50%] w-full justify-center sm:h-screen">
        <SulikoLogo
          className="absolute z-1000 sm:block top-[20px] left-[20px]"
          width={100}
        />
        <SulikoForm />
      </div>
      <SulikoFormBanner />
    </div>
  );
}
