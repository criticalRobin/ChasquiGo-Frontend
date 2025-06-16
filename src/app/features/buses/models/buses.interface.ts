export interface IBuses {
    id?: string;
    cooperativeId: number;
    licensePlate: string;
    chassisBrand: string;
    bodyworkBrand: string;
    photo?: string;
    stoppageDays: number;
    busTypeId: number;
    seats: IBusSeat[];
    // Campos locales para UI (no se envían al backend)
    capacity?: number;
    floorCount?: number;
    photos?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBusSeat {
    number: string;
    type: 'NORMAL' | 'VIP' ;
    location: 'ventana' | 'pasillo' | 'other';
}