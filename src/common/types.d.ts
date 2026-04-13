type RawJob = {
  title: string;
  description: string;
  salary_raw: string;
  salary: {
    min: number;
    max: number;
  };
  requirements: string[];
  tags: string[];
  is_remote: boolean;
  location?: string;
};
