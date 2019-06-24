import React from 'react'
import { createGlobalStyle } from 'styled-components'
import Chart from './Chart'

const GlobalStyle = createGlobalStyle`
@import url('https://fonts.googleapis.com/css?family=Raleway:400,600&display=swap');

body {
  font-family: 'Raleway', Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 0;
}
`

function App() {
  return (
    <>
      <GlobalStyle />
      <Chart />
    </>
  )
}

export default App
