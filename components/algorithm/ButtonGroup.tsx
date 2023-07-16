import React from 'react';
import RowLayout from '../RowLayout';

const ButtonGroup = ({ children, className }: { children: React.ReactNode; className: string }) => {
  return <RowLayout className={className}>{children}</RowLayout>;
};

interface ButtonProps {
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <button className="px-4 border rounded border-solid border-gray-600" onClick={onClick}>
      {children}
    </button>
  );
};

ButtonGroup.Button = Button;

export default ButtonGroup;
