// "use client";

// import html2pdf from "html2pdf.js";

// export default function DownloadPDFButton() {
//   const handleDownload = () => {
//     const element: any = document.getElementById("student-infos" );

//     const opt: any = {
//       margin: 10,
//       filename: "user-profile.pdf",
//       image: { type: "jpeg", quality: 0.98 },
//       html2canvas: { scale: 2 }, // improves quality
//       jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
//     };

//     html2pdf().set(opt).from(element).save();
//   };

//   return (
//     <button
//       onClick={handleDownload}
//       className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
//     >
//       Download PDF
//     </button>
//   );
// }