export interface IBuses {
    id?: string;
    cooperativeId: number;
    licensePlate: string;
    chassisBrand: string;
    bodyworkBrand: string;
    photos: string[];
    capacity: number;
    stoppageDays: number;
    floorCount: number;
    seats: IBusSeat[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBusSeat {
    number: string;
    type: 'normal' | 'vip' | 'preferential';
    location: 'ventana' | 'pasillo' | 'other';
}