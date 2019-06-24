import styled from 'styled-components'
import constants from '../constants'

const { width, height, tooltipWidth } = constants

export const Container = styled.div`
  overflow-x: hidden;
  display: grid;
  grid-template-rows: 80px 600px 1fr;
  align-items: center;
  justify-items: center;
  user-select: none;
`

export const Header = styled.header`
  width: 100%;
  height: 80px;
  display: flex;
  flex-direction: column;
  .title {
    font-size: 30px;
    font-weight: 600;
    color: #333333;
    padding: 5px 10px 5px;
  }
  .actions {
    display: flex;
    margin-left: 20px;
  }
`

export const Action = styled.div`
  font-size: 13px;
  font-weight: 600;
  background: ${p => (p.selected ? '#333333' : '#ffffff')};
  color: ${p => (p.selected ? '#ffffff' : '#333333')};
  border: 1px solid #cacaca;
  padding: 4px 8px;
  margin-right: 5px;
  cursor: pointer;
`

export const Select = styled.select`
  font-size: 13px;
  font-weight: 600;
  font-family: 'Raleway', Arial, Helvetica, sans-serif;
  background: ${p => (p.selected ? '#333333' : '#ffffff')};
  color: ${p => (p.selected ? '#ffffff' : '#333333')};
  border: 1px solid #cacaca;
  padding: 4px 8px;
  outline: 0;
  cursor: pointer;
`

export const Visualization = styled.div`
  width: ${width}px;
  height: ${height}px;
  .title {
    font-size: 18px;
    font-weight: 600;
  }
`

export const Footer = styled.footer`
  width: 100%;
  p {
    width: 500px;
    margin: 20px auto;
    text-align: justify;
  }
  svg {
    width: 15px;
    height: 15px;
  }
  strong {
    font-weight: 600;
  }
  a {
    color: #f57a29;
  }
  .footer {
    width: 75%;
    margin: 20px auto;
    text-align: center;
  }
`

export const Tooltip = styled.div`
  width: ${tooltipWidth}px;
  position: absolute;
  top: -1000px;
  left: -1000px;
  opacity: 0;
  background: #ffffff;
  color: #000000;
  border: 2px solid #000000;
  border-radius: 4px;
  font-size: 13px;
  padding: 10px;
  pointer-events: none;
  .label {
    font-weight: 600;
  }
  svg {
    width: 25px;
    height: 25px;
  }
`
