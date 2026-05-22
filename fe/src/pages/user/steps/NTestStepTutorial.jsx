import Tutorial from "../../../assets/Tutorial.mp4";

export default function NTestStepTutorial({ onNext }) {
  return (
    <div className="flex h-screen w-full items-center justify-center overflow-y-auto p-8 text-center text-white">
      <div className="flex w-full max-w-3xl flex-col items-center rounded-[2rem] bg-slate-950/35 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md">
        <h1 className="text-4xl font-bold mb-4">Como funcionará o teste?</h1>
        <p className="text-lg text-slate-300 mb-8">
          Assista ao vídeo abaixo para entender como realizar o teste
          corretamente.
        </p>

        {/* Container do Vídeo Tutorial */}
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-8 border border-slate-700">
          <video src={Tutorial} controls className="w-full h-full object-cover">
            Seu navegador não suporta o elemento de vídeo.
          </video>
        </div>

        <div className="text-md text-slate-400 mb-8 max-w-xl space-y-2">
          <p>
            <strong>Aviso:</strong> No próximo passo, pediremos permissão para
            acessar sua câmera.
          </p>
          <p>
            Para o melhor resultado, fique em um ambiente iluminado, alinhe seu
            rosto na tela e tente não mover a cabeça durante a exibição das
            imagens.
          </p>
        </div>

        <button
          onClick={onNext}
          className="px-8 py-4 bg-sinapgreen-500 text-black font-bold text-lg rounded-full hover:bg-sinapgreen-800 transition shadow-[0_0_15px_rgba(0,200,230,0.4)]"
        >
          Entendi, habilitar a câmera
        </button>
      </div>
    </div>
  );
}
