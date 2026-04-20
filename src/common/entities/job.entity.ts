import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ unique: true })
  link: string;

  @Column({ default: false })
  is_remote: boolean;

  @Column('jsonb', { default: [] })
  requirements: string[];

  @Column('jsonb', { default: [] })
  tags: string[];

  @Column({ nullable: true })
  salary_raw: string;

  @Column('int', { nullable: true })
  salary_min: number;

  @Column('int', { nullable: true })
  salary_max: number;

  @CreateDateColumn()
  created_at: Date;
}
