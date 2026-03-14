// 사용자 이벤트 레이아웃 — 모바일 퍼스트, 데스크탑에서도 480px 중앙 정렬 유지
export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-[480px] flex flex-col flex-1">
        {children}
      </div>
    </div>
  );
}
