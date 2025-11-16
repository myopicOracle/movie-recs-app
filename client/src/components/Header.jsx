import appIcon from '../assets/icon.png'

export default function Header() {
    return (
        <nav>
            <h1>Movie Recs App</h1>
            <img src={appIcon} alt="App logo" />
        </nav>
    )
}