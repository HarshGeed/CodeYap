"use client";
import { usePathname } from "next/navigation";
import SideBar from "@/components/SideBar";

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientSidebarWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if current route is login or signup
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <>
      {!isAuthPage && <SideBar/>}
      <div className={isAuthPage ? "" : "ml-[5rem] mr-3"}>
        {children}
      </div>
    </>
  );
}
