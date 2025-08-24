"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Tabsection() {
  const searchParams = useSearchParams();
  const excelData = JSON.parse(decodeURIComponent( searchParams.get("excelData")));
  const [activeTab, setActiveTab] = useState("2D");
  return (
    <div>
      <div className="my-16 flex  justify-center">
        <button  className="mx-10" onClick={() => setActiveTab("2D")}> 2D</button>
        <button onClick={() => setActiveTab("3D")}> 3D</button>
      </div>
      {activeTab === "2D" &&(
        <div>vinay</div>
      )}

      {activeTab === "3D" &&(
        <div>vinay1</div>
      )}
    </div>
  );
}
