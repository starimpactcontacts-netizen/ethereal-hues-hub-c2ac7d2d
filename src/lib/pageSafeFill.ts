export function getPageSafeFill(pathname: string) {
  if (pathname.startsWith('/editorium')) {
    return '0 0% 100%';
  }

  if (pathname.startsWith('/loopy')) {
    return '0 0% 13%'; // #222222 equivalent
  }

  return '0 0% 0%';
}
