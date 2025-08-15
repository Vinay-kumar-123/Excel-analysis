// app/layout.js
import "./globals.css";
import Header from "@/components/Header";
import Providers from "../redux/provide";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata = {
  title: {
    default: "Excel-Analysis",
    template: "%s | Excel-Analysis",
  },
  description: "Welcome to my new project excel-analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        
        <Providers>
          <Header />
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
          />
        </Providers>
      </body>
    </html>
  );
}
