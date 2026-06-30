import { render } from 'preact';
import { App } from './App.tsx';
import './styles/tokens.css';
import './styles/reset.css';
import './styles/global.css';

render(<App />, document.getElementById('app')!);
