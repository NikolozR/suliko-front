import SulikoForm from "@/components/SulikoForm";
import Image from "next/image";
import SulikoLogoWhite from "../../../../public/suliko_logo_white.svg";
import SulikoLogoBlack from "../../../../public/Suliko_logo_black.svg";


export default function SignUp() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex items-center w-[50%] justify-center h-screen">
        <div>
          <Image src={SulikoLogoBlack} width={100} className="absolute top-[30px] left-[30px]" alt="Suliko Black Logo" ></Image>
        </div>
        <SulikoForm />
      </div>
      <div className="w-[50%] h-full suliko-default-bg flex justify-center items-center">
        <Image src={SulikoLogoWhite} width={400} alt="Suliko White Logo" />
      </div>
    </div>
  );
}
