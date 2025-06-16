export interface IBuses {
    id?: string;
    cooperativeId: number;
    licensePlate: string;
    chassisBrand: string;
    bodyworkBrand: string;
    photo?: string | null;
    stoppageDays: number;
    busTypeId: number;
    seats: IBusSeat[];
    // Campos locales para UI (no se envían al backend)
    capacity?: number;
    floorCount?: number;
    photos?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    numberOfFloors?: number; // 1 or 2 - Solo para UI (ahora opcional)
}

export interface IBusSeat {
    number: string;
    type: 'NORMAL' | 'VIP';
    location: 'ventana' | 'pasillo' | 'other';
    floor?: number; // 1 or 2 - Solo para UI (ahora opcional)
}