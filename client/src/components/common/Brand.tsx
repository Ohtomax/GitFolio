import { Link } from 'react-router-dom';
import logo from '../../assets/brand-mark.jpg';
import wordmark from '../../assets/brand-wordmark.jpg';

export function Brand() {
  return <Link to="/" className="inline-flex shrink-0 overflow-hidden rounded-lg bg-stone-900" aria-label="GitFolio home">
    <picture>
      <source media="(max-width: 374px)" srcSet={logo} />
      <img src={wordmark} alt="GitFolio" width={176} height={44}
        className="h-10 w-36 object-cover max-[374px]:w-10 sm:h-11 sm:w-44" />
    </picture>
  </Link>;
}
