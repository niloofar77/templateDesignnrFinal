import { useState } from 'react'

import './App.css'

import PdfDesignerAndGenerator2 from './components/PdfDesignerAndGenerator2'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
   {/* <PdfDesignerAndGenerator></PdfDesignerAndGenerator> */}
   <div style={{width:"100%"}}>
   <PdfDesignerAndGenerator2></PdfDesignerAndGenerator2>
   </div>


    </>
  )
}

export default App
