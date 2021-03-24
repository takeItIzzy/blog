import Clock from 'public/icons/clock.svg';
import formatDate from 'libs/date';

const Time = ({
  date,
  mode = 'yyyy-MM-dd',
  className,
}: {
  date: string;
  mode?: string;
  className?: string;
}) => {
  return (
    <span className={`flex items-center text-xs ${className}`}>
      <Clock className="fill-current w-4 h-4 mr-1" />
      {formatDate(date, mode)}
    </span>
  );
};

export default Time;
