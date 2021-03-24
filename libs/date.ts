import { format } from 'date-fns';

const formatDate = (date: string, mode: string) => {
  return format(new Date(date), mode);
};

export default formatDate;
