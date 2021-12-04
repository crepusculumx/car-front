import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private httpClient: HttpClient) {}

  getPreviewFeaturess(): Observable<any> {
    return this.httpClient.get(`paths/beijing/center-features`);
  }

  getLaneLineFeatures(): Observable<any> {
    return this.httpClient.get(`paths/beijing/lane-line-features`);
  }
}
