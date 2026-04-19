export function getPageSafeFill(pathname: string) {
  if (pathname.startsWith('/editorium')) {
    return '0 0% 100%';
  }

  if (pathname.startsWith('/loopy')) {
    return '0 0% 13%'; // #222222 equivalent
  }

  if (pathname.startsWith('/arena')) {
    return '0 0% 10.2%'; // #1a1a1a — synced with nav
  }

  return '0 0% 10.2%'; // #1a1a1a
}
