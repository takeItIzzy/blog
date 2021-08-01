const options = <Returns, Params = unknown>(
  selector: Record<string | number, (...params: Params[]) => Returns>,
  option: string | number,
  ...params: Params[]
) => selector[option]?.(...params) ?? selector.default?.(...params);

export default options;
