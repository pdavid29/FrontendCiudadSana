import { Injectable, signal } from '@angular/core';
import { Category, LocalData, Report, ReportStatus, User } from '../models/ciudad-sana.models';

const emptyData = (): LocalData => ({ users: [], categories: [], reports: [] });

@Injectable({ providedIn: 'root' })
export class LocalDataService {
  private readonly state = signal<LocalData>(emptyData());
  readonly data = this.state.asReadonly();

  user(id: string): User | undefined { return this.state().users.find((user) => user.id === id); }
  findUser(email: string): User | undefined { return this.state().users.find((user) => user.email.toLowerCase() === email.toLowerCase()); }
  addUser(user: User): void { this.state.update((data) => ({ ...data, users: [...data.users, user] })); }
  updateUser(id: string, update: Partial<User>): void {
    this.state.update((data) => ({ ...data, users: data.users.map((user) => user.id === id ? { ...user, ...update, updatedAt: new Date().toISOString() } : user) }));
  }
  addCategory(category: Category): void { this.state.update((data) => ({ ...data, categories: [...data.categories, category] })); }
  updateCategory(id: string, update: Partial<Category>): void {
    this.state.update((data) => ({ ...data, categories: data.categories.map((category) => category.id === id ? { ...category, ...update } : category) }));
  }
  replaceCategories(categories: Category[]): void { this.state.update((data) => ({ ...data, categories })); }
  addReport(report: Report): void { this.state.update((data) => ({ ...data, reports: [report, ...data.reports] })); }
  replaceReports(reports: Report[]): void { this.state.update((data) => ({ ...data, reports })); }
  report(id: string): Report | undefined { return this.state().reports.find((report) => report.id === id); }
  updateReport(id: string, update: Partial<Report>, event?: { by: string; status: ReportStatus; note: string }): void {
    const at = new Date().toISOString();
    this.state.update((data) => ({ ...data, reports: data.reports.map((report) => report.id !== id ? report : {
      ...report, ...update, updatedAt: at, history: event ? [...report.history, { ...event, at }] : report.history,
    }) }));
  }
}
