import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function EnvVarWarning() {
  return (
    <div className="flex gap-4 items-center">
      <Badge variant={"outline"} className="font-normal">
        Supabase 환경 변수가 필요합니다
      </Badge>
      <div className="flex gap-2">
        <Button size="sm" variant={"outline"} disabled>
          로그인
        </Button>
        <Button size="sm" variant={"default"} disabled>
          회원가입
        </Button>
      </div>
    </div>
  );
}
