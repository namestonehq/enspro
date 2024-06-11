"use client";
import { useMemo, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "./ui/pagination";

import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

import { Label } from "./ui/label";
import { Address } from "viem";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

import { EnableModal } from "./EnableModal";
import { CaretRightIcon, CheckIcon } from "@radix-ui/react-icons";

type NameTableProps = {
  names: Name[];
  selectedName: string;
  onSelectName: (name: string) => void;
};

const options: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

type Name = {
  name: string;
  resolver?: string;
  status?: boolean;
  parentName?: string;
  owner?: Address;
  resolvedAddress?: Address;
  createdAt?: {
    date: string;
    value: number;
  };
  expiryDate?: {
    date: string;
    value: number;
  };
};

export default function NameTable({
  names,
  selectedName,
  onSelectName,
}: NameTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const handleRowClick = (name: string) => {
    onSelectName(name);
  };
  const currentTimestamp = Math.floor(Date.now());
  const filteredNames = names.filter(
    (name) => name.expiryDate && name.expiryDate.value >= currentTimestamp
  );
  const displayedNames = useMemo(() => {
    // First, sort the names by status, true first
    const sortedNames = filteredNames.sort((a, b) => {
      // Assuming status can only be true or false
      return (b.status === true ? 1 : 0) - (a.status === true ? 1 : 0);
    });

    // Then, slice the sorted array for pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedNames.slice(startIndex, endIndex);
  }, [filteredNames, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNames.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const emptyRows = itemsPerPage - displayedNames.length;

  return (
    <div className="flex flex-col h-full">
      <RadioGroup value={selectedName} onValueChange={onSelectName}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Expiration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedNames.map((name) => (
              <TableRow
                className={`h-10 cursor-pointer  ${
                  selectedName === name.name ? "bg-gray-100  " : ""
                }`}
                key={name.name}
                onClick={() => handleRowClick(name.name)}
              >
                <TableCell className="font-medium flex  justify-between ">
                  <div className="flex items-center">
                    <Label
                      className={`cursor-pointer h-4 truncate max-w-[200px] `}
                    >
                      {name.name}
                    </Label>
                  </div>
                  <div className=" text-slate-400">
                    {name.status && <CheckIcon />}{" "}
                  </div>
                </TableCell>

                <TableCell>
                  {name.expiryDate
                    ? new Date(name.expiryDate.value).toLocaleDateString(
                        undefined,
                        options
                      )
                    : ""}
                </TableCell>
              </TableRow>
            ))}
            {emptyRows > 0 &&
              Array.from({ length: emptyRows }).map((_, index) => (
                <TableRow className="h-10" key={`empty-${index}`}>
                  <TableCell>&nbsp;</TableCell>
                  <TableCell>&nbsp;</TableCell>
                  <TableCell>&nbsp;</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </RadioGroup>
      {/* Pagination */}
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            {Array.from({ length: totalPages }, (_, index) => (
              <PaginationItem key={index} className="cursor-pointer">
                <PaginationLink
                  onClick={() => handlePageChange(index + 1)}
                  className={currentPage === index + 1 ? "bg-gray-300" : ""}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}