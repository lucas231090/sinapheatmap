import { useTheme } from "@/hooks/useTheme";
import { useSignup } from "@/hooks/useSignup";
import Logo from "@/components/General/Logo";
import SignupForm from "@/components/General/SignupForm";

const SignupPage = () => {
  const { logoSrc } = useTheme();
  const { formData, error, isLoading, updateField, handleSubmit } = useSignup();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-lg md:max-w-2xl p-6 bg-card dark:bg-darkcard shadow-md rounded-md">
        <Logo logoSrc={logoSrc} />
        <SignupForm
          formData={formData}
          error={error}
          isLoading={isLoading}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default SignupPage;
