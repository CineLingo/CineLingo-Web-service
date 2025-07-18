import HomeButton from "@/components/home-button";

export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <HomeButton variant="floating" />
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p>
        Sorry, we were unable to sign you in. Please try again.
      </p>
    </div>
  );
}
