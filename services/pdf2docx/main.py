from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pdf2docx import Converter
import tempfile
import os
import io
from pathlib import Path

app = FastAPI(title="PDF to DOCX Converter Service")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/convert")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    """
    Convert a PDF file to DOCX format
    
    Args:
        file: PDF file to convert
        
    Returns:
        DOCX file as streaming response
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Create temporary files
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        pdf_path = temp_dir_path / "input.pdf"
        docx_path = temp_dir_path / "output.docx"
        
        # Save uploaded PDF
        with open(pdf_path, "wb") as pdf_file:
            content = await file.read()
            pdf_file.write(content)
        
        try:
            # Convert PDF to DOCX
            cv = Converter(str(pdf_path))
            cv.convert(str(docx_path))
            cv.close()
            
            # Read the DOCX file
            with open(docx_path, "rb") as docx_file:
                docx_content = docx_file.read()
            
            # Return as streaming response
            return StreamingResponse(
                io.BytesIO(docx_content),
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={
                    "Content-Disposition": f"attachment; filename=converted.docx"
                }
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Conversion failed: {str(e)}"
            )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
