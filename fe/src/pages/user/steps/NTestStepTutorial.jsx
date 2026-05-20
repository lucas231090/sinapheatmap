export default function NTestStepTutorial({ onNext }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#1e293b] p-8 text-center text-white overflow-y-auto">
      <div className="max-w-3xl w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4">Como funcionará o teste?</h1>
        <p className="text-lg text-slate-300 mb-8">
          Assista ao vídeo abaixo para entender como realizar o teste
          corretamente.
        </p>

        {/* Container do Vídeo Tutorial */}
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-8 border border-slate-700">
          <video
            // Substitua o 'src' abaixo pelo link real do seu vídeo de tutorial ou arquivo estático
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            controls
            className="w-full h-full object-cover"
          >
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
          className="px-8 py-4 bg-[#00C8E6] text-black font-bold text-lg rounded-full hover:bg-[#11b5d1] transition shadow-[0_0_15px_rgba(0,200,230,0.4)]"
        >
          Entendi, habilitar a câmera
        </button>
      </div>
    </div>
  );
}
