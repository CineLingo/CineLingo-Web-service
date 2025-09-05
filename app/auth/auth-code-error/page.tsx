 

export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold mb-4">인증 오류</h1>
      <p>
        죄송합니다. 로그인에 실패했습니다. 다시 시도해 주세요.
      </p>
    </div>
  );
}
