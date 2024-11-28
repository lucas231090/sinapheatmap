import React from 'react';
import './Header.css';
import { Outlet } from 'react-router-dom';
import logo from './SinapsenseLogo.png'

function Header() {
    return (
        <div>
            <header className="header">
                <a href="/">
                    <img src={logo} alt="Sinapsense Logo" className="logo" />
                </a>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}
export default Header;