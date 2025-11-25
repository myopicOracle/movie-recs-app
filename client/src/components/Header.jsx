import appIcon from '../assets/icon.png'

export default function Header() {
    return (
        <nav className='header'>
            <img src={appIcon} alt="App logo" className="logo"/>
            <h1>Movie Recs App</h1>
        </nav>
    )
}