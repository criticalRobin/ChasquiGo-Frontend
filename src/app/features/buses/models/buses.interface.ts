export interface IBuses {
    id?: number;
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
    isDeleted?: boolean;
}

export interface IBusSeat {
    id?: number;
    busId?: number;
    number: string;
    type: 'NORMAL' | 'VIP';
    location: 'ventana' | 'pasillo' | 'other';
    isDeleted?: boolean;
}