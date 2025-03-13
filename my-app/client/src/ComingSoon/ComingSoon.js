import React, {useState} from 'react'
import './ComingSoon.css'
import MeltixLogo from '../assets/MeltixLogo.png'

function ComingSoon(){

    return(<html>
        <head>
            <title>Meltix Technologies</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body>
            <div class="background"/>
            <div class="content">
                <img className="fade-in"src={MeltixLogo}></img>
                    <h1 className="fade-text"> Join the New Generation</h1>
                    <h2 className="fade-text">Coming Soon </h2>
                    <h3 className="fade-text">Email info@meltixtech.com for inquiries</h3>
            </div>
        </body>
        </html>
        );

}
export default ComingSoon