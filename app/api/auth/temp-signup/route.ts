import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, repeatPassword, signupType } = body;

    // 필수 필드 검증
    if (!email || !password || !repeatPassword || !signupType) {
      return NextResponse.json(
        { error: "모든 필수 필드가 필요합니다." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "유효한 이메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    // 비밀번호 일치 확인
    if (password !== repeatPassword) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 임시 데이터를 세션에 저장 (실제로는 서버 세션이나 Redis 등을 사용하는 것이 좋습니다)
    // 여기서는 간단히 성공 응답만 반환하고, 클라이언트에서 세션스토리지를 사용하도록 합니다
    return NextResponse.json({
      success: true,
      message: "회원가입 데이터가 임시 저장되었습니다."
    });

  } catch (error) {
    console.error('임시 회원가입 API 오류:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
