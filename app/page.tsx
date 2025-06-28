import SideBar from "@/components/SideBar";

export default function HomePage() {
  return (
    <>
      <div className="grid grid-cols-[1fr_2fr] gap-2 h-screen">
        <div className="border-1 border-white">
          <div className="flex mt-3"> 
            <h1 className="font-semibold text-3xl">Chats</h1>
           <button className="ml-auto bg-[#2b4a7b] text-white px-2 py-auto rounded">New Chat</button>
          </div>
        </div>
        <div className="border-1 border-white">Column 2 (2fr)</div>
      </div>
     
    </>
  );
}
