export function getPageSafeFill(pathname: string) {
  if (pathname.startsWith('/editorium')) {
    return '0 0% 100%';
  }

  if (pathname.startsWith('/loopy')) {
    return '0 0% 13%'; // #222222 equivalent
  }

  if (pathname.startsWith('/arena')) {
    return '0 0% 4%'; // #0A0A0A
  }

  if (pathname.startsWith('/clippers') || pathname.startsWith('/missions')) {
    return '0 0% 4%'; // Loopgate soft black — matches surface-0
  }

  return '0 0% 4%'; // #0A0A0A
}
