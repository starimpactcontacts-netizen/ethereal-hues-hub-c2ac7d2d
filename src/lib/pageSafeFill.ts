export function getPageSafeFill(pathname: string) {
  if (pathname.startsWith('/editorium')) {
    return '0 0% 100%';
  }

  return '0 0% 0%';
}
