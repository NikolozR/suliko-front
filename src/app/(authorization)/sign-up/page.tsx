import SulikoForm from "@/components/SulikoForm";
import Image from "next/image";
import SulikoLogoWhite from "../../../../public/suliko_logo_white.svg";
import SulikoLogoBlack from "../../../../public/Suliko_logo_black.svg";


export default function SignUp() {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-center items-center h-screen">
      <div className="flex relative items-center sm:w-[50%] w-full justify-center sm:h-screen">
        <div>
          <Image src={SulikoLogoBlack} width={100} className="absolute hidden sm:block top-[20px] left-[20px]" alt="Suliko Black Logo" ></Image>
        </div>
        <SulikoForm />
      </div>
      <div className="w-full py-[100px] sm:py-0 sm:w-[50%] h-full suliko-default-bg flex justify-center items-center z-10">
        <Image src={SulikoLogoWhite} width={300} alt="Suliko White Logo" className="lg:w-[400px]"/>
      </div>
    </div>
  );
}
