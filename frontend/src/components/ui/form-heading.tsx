interface FormHeadingProps {
  heading: string;
  subheading: string;
}

export const FormHeading = ({ heading, subheading }: FormHeadingProps) => {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        {heading}
      </h1>
      <p className="mt-2 text-sm text-gray-400">{subheading}</p>
    </div>
  );
};
