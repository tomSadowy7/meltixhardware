import React, {useState} from 'react'
import './Header.css'
import MeltixLogo from '../assets/MeltixLogo.png'

function Header(){

    return(
    <header class="header">
        <nav class="nav">
            <ul>
                <img className="image"src={MeltixLogo}></img>
                <li><a href="#">Home</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Products</a></li>
                <li><a href="#">Contact</a></li>
            </ul>
        </nav>
    </header>)  

}
export default Header