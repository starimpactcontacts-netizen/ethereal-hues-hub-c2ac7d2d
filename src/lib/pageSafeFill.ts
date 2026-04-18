export function getPageSafeFill(pathname: string) {
  if (pathname.startsWith('/editorium')) {
    return '0 0% 100%';
  }

  if (pathname.startsWith('/loopy')) {
    return '0 0% 13%'; // #222222 equivalent
  }

  if (pathname.startsWith('/arena')) {
    return '0 0% 4%'; // #0A0A0A premium dark
  }

  return '0 0% 0%';
}
