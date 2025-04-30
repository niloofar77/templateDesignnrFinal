import React, { useEffect, useRef, useState } from "react";
import { Designer, Form } from "@pdfme/ui";
import { generate } from "@pdfme/generator";
import { text, image, barcodes } from "@pdfme/schemas";
import { PDFDocument } from "pdf-lib";
import type { Template } from '@pdfme/common';


// const plugins: Record<string, Plugin> = {
//   text,
//   image,
//   qrcode: barcodes.qrcode,
// };
const plugins = {
  text,
  image,
  qrcode: barcodes.qrcode,
} 
const createBlankPdf = async (): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  page.drawText("");
  return pdfDoc.save();
};
 
const PdfDesignerAndGenerator2: React.FC = () => {
  const designerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const designerInst = useRef<Designer | null>(null);
  const formInst = useRef<Form | null>(null);
  const [designTpl, setDesignTpl] = useState<Template | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [blankPdfUrl, setBlankPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>("Blank PDF");
  const [isDesignerDestroyed, setIsDesignerDestroyed] = useState<boolean>(false);
  const [isFormDestroyed, setIsFormDestroyed] = useState<boolean>(false);
 
  useEffect(() => {
    setIsLoading(true);
    createBlankPdf().then((buf) => {
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setBlankPdfUrl(url);
      // setDesignTpl({ basePdf: buf, schemas: [{}] });
      setDesignTpl({ basePdf: buf, schemas: [] });
      setIsLoading(false);
    });
    
    return () => {
      if (blankPdfUrl) URL.revokeObjectURL(blankPdfUrl);
    };
  }, []);


  useEffect(() => {
    if (!designerRef.current || !designTpl) return;
    

    if (designerInst.current) {
      try {
        designerInst.current.destroy();
      } catch (err) {
        console.log("Designer was already destroyed or failed to destroy");
      }
      designerInst.current = null;
    }
  
    const timer = setTimeout(() => {
      try {
        if (designerRef.current) {
          designerInst.current = new Designer({
            domContainer: designerRef.current,
            template: designTpl,
            plugins,
          });
          setIsDesignerDestroyed(false);
          console.log("Designer initialized successfully");
        }
      } catch (err) {
        console.error("Error initializing Designer:", err);
      }
    }, 100);
   
    return () => {
      clearTimeout(timer);
      if (designerInst.current && !isDesignerDestroyed) {
        try {
          designerInst.current.destroy();
          setIsDesignerDestroyed(true);
        } catch (err) {
          console.log("Error destroying designer:", err);
        }
        designerInst.current = null;
      }
    };
  }, [designTpl]);


  useEffect(() => {
    if (!showForm || !formRef.current) return;
    
  
    if (formInst.current) {
      try {
        formInst.current.destroy();
      } catch (err) {
        console.log("Form was already destroyed or failed to destroy");
      }
      formInst.current = null;
    }
    
    
    const timer = setTimeout(() => {
      try {
        if (!designerInst.current) {
          console.error("Designer instance is not available");
          return;
        }
        
        const template = designerInst.current.getTemplate();
        const initialInputs = [{}];
        
        if (formRef.current) {
          formInst.current = new Form({
            domContainer: formRef.current,
            template,
            inputs: initialInputs,
            plugins,
          });
          setIsFormDestroyed(false);
          console.log("Form initialized successfully");
        }
      } catch (err) {
        console.error("Error initializing Form:", err);
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (formInst.current && !isFormDestroyed) {
        try {
          formInst.current.destroy();
          setIsFormDestroyed(true);
        } catch (err) {
          console.log("Error destroying form:", err);
        }
        formInst.current = null;
      }
    };
  }, [showForm]);
 
 
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setFileName(file.name);
    
    try {
      const buf = await file.arrayBuffer();
      setPdfUrl(null);
      
   
      if (designerInst.current && !isDesignerDestroyed) {
        try {
          designerInst.current.destroy();
          designerInst.current = null;
        } catch (err) {
          console.log("Error destroying designer:", err);
        }
      }
      
      setShowForm(false);
      // setDesignTpl({ basePdf: new Uint8Array(buf), schemas: [{}] });
      setDesignTpl({ basePdf: buf, schemas: [] });
    } catch (err) {
      console.error("Error handling file:", err);
      alert("Error loading PDF file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
 

  const handleShowForm = () => {
    if (!designerInst.current) {
      return alert("Designer is not ready yet.");
    }
    
    try {
      const template = designerInst.current.getTemplate();
      if (!template.schemas[0] || 
          (typeof template.schemas[0] === 'object' && Object.keys(template.schemas[0]).length === 0)) {
        return alert("Please add some fields to the designer first.");
      }
  
      setShowForm(true);
    } catch (err: any) {
      console.error("Error preparing form:", err);
      alert(`Error preparing form: ${err.message}`);
    }
  };

  
  const handleGeneratePDF = async () => {
    if (!formInst.current) {
      return alert("Form is not ready yet.");
    }
    
    setIsLoading(true);
    
    try {
     
      let template;
      if (designerInst.current && !isDesignerDestroyed) {
        template = designerInst.current.getTemplate();
      } else {
        return alert("Designer is not available. Please go back to designer view and try again.");
      }
      
      
      const inputs = formInst.current.getInputs();
      
      const pdfData = await generate({
        template,
        inputs,
        plugins,
      });
      
      const blob = new Blob([pdfData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace('.pdf', '')}_filled.pdf`;
      a.click();
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      alert(`Error generating PDF: ${err.message}\nPlease check the console for more details.`);
    } finally {
      setIsLoading(false);
    }
  };
 

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

 
  const handleBackToDesigner = () => {
  
    if (formInst.current && !isFormDestroyed) {
      try {
        formInst.current.destroy();
        formInst.current = null;
        setIsFormDestroyed(true);
      } catch (err) {
        console.log("Error destroying form:", err);
      }
    }
    
    setShowForm(false);
  };
 
  return (
    <div style={{ 
      padding: "30px", 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#f8f9fa",
      minHeight: "100vh"
    }}>
      <div style={{
        maxWidth: "2200px",
        margin: "0 auto",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: "30px"
      }}>
        <h2 style={{
          fontSize:"36px", 
          textAlign: "center", 
          color: "#2c3e50",
          marginBottom: "30px",
          borderBottom: "2px solid #eee",
          paddingBottom: "15px"
        }}>PDF Template Designer</h2>
        
        <div style={{
          display: "flex", 
          justifyContent: "center", 
          marginBottom: "30px",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <p style={{ marginBottom: "10px", fontSize: "16px", color: "#555" }}>
            Current file: <strong>{fileName}</strong>
          </p>
          <label style={{
            padding: "12px 24px",
            backgroundColor: "#4a6fa5",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "inline-block"
          }}>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFile} 
              style={{ display: "none" }}
            />
            Choose PDF File
          </label>
        </div>
        
        {isLoading ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px"
          }}>
            <div style={{
              border: "5px solid #f3f3f3",
              borderTop: "5px solid #3498db",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              animation: "spin 1s linear infinite"
            }}></div>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        ) : !showForm ? (
          <>
            <div style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              overflowX: "auto",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              padding: "20px 0"
            }}>
              <div
                ref={designerRef}
                style={{
                  width: "2000px",
                  height: 1000,
                  border: "1px solid #ddd",
                  margin: "0",
                  backgroundColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderRadius: "4px"
                }}
              />
            </div>
            
            <div style={{
              display: "flex", 
              justifyContent: "center", 
              marginTop: "30px"
            }}>
              <button
                onClick={handleShowForm}
                style={{
                  padding: "20px 40px",
                  background: "linear-gradient(135deg, #3498db, #2980b9)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize:"20px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                  fontWeight: "bold"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                }}
              >
                Fill Form
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{
              fontSize:"28px", 
              textAlign: "center",
              color: "#2c3e50",
              marginBottom: "20px"
            }}>Fill the Form</h3>
            <div style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              overflowX: "auto",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              padding: "20px 0"
            }}>
              <div
                ref={formRef}
                style={{
                  width: "2024px",
                  minHeight: "1000px",
                  border: "1px solid #ddd",
                  margin: "0",
                  backgroundColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderRadius: "4px"
                }}
              />
            </div>
            
            <div style={{
              display: "flex", 
              justifyContent: "center", 
              marginTop: "30px",
              gap: "20px"
            }}>
              <button
                onClick={handleBackToDesigner}
                style={{
                  padding: "15px 30px",
                  background: "#6c757d",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize:"16px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#5a6268";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#6c757d";
                }}
              >
                Back to Designer
              </button>
              
              <button
                onClick={handleGeneratePDF}
                style={{
                  padding: "15px 30px",
                  background: "linear-gradient(135deg, #2ecc71, #27ae60)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize:"16px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                  fontWeight: "bold"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                }}
              >
                Generate PDF
              </button>
            </div>
          </>
        )}
    
        {pdfUrl && (
          <div style={{ 
            marginTop: 30,
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px" 
          }}>
            <h4 style={{
              fontSize:"24px", 
              textAlign: "center",
              color: "#2c3e50",
              marginBottom: "20px"
            }}>Preview</h4>
            <div style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              overflowX: "auto"
            }}>
              <iframe
                src={pdfUrl}
                title="pdf-preview"
                style={{ 
                  width: "2000px", 
                  height: "1000px", 
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)" 
                }}
              />
            </div>
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              marginTop: "20px" 
            }}>
              <a 
                href={pdfUrl} 
                download={`${fileName.replace('.pdf', '')}_filled.pdf`}
                style={{
                  padding: "12px 24px",
                  background: "#3498db",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#2980b9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#3498db";
                }}
              >
                Download PDF
              </a>
            </div>
          </div>
        )}
      </div>
      
      <footer style={{
        textAlign: "center",
        marginTop: "30px",
        padding: "20px 0",
        color: "#7f8c8d",
        fontSize: "14px"
      }}>
        <p>PDF Template Designer © 2025</p>
      </footer>
    </div>
  );
};

export default PdfDesignerAndGenerator2;
