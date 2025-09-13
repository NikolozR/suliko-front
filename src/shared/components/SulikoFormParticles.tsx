import SulikoParticles from "./SulikoParticles";

const SulikoFormParticles: React.FC = () => {
  return (
    <SulikoParticles
      className="lg:block hidden"
      fullScreen={false}
      particleCount={80}
      speed={1}
      enableInteractions={false}
    />
  );
};

export default SulikoFormParticles;
