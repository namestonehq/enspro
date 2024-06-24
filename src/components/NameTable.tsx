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

import { Button } from "./ui/button";
import Link from "next/link";

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
    <div className="flex text-white flex-col h-full ">
      <RadioGroup value={selectedName} onValueChange={onSelectName}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-neutral-800">
              <TableHead className=" text-neutral-300">Name</TableHead>
              <TableHead className=" text-neutral-300">Expiration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedNames.map((name) => (
              <TableRow
                className={`h-10 cursor-pointer   ${
                  selectedName === name.name
                    ? " bg-neutral-700   text-emerald-400  "
                    : ""
                }`}
                key={name.name}
                onClick={() => handleRowClick(name.name)}
              >
                <TableCell className="font-medium flex   min-w-60 sm:min-w-96 grow  justify-between ">
                  {name.name}
                </TableCell>

                <TableCell className="w-full  ">
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
                <TableRow
                  className="h-10 hover:bg-neutral-800 "
                  key={`empty-${index}`}
                >
                  <TableCell>&nbsp;</TableCell>
                  <TableCell>&nbsp;</TableCell>
                  <TableCell>&nbsp;</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </RadioGroup>
      {/* Pagination */}
      <div className="flex justify-between mt-8">
        <div>
          <Pagination>
            <PaginationContent className="">
              {Array.from({ length: totalPages }, (_, index) => (
                <PaginationItem key={index} className="cursor-pointer">
                  <PaginationLink
                    onClick={() => handlePageChange(index + 1)}
                    className={
                      currentPage === index + 1 ? "  bg-neutral-600 " : ""
                    }
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        </div>

        <div className="flex">
          <Button disabled={selectedName == ""} className="w-32">
            {" "}
            <Link href={`/manage?name=${selectedName}`}>Manage Name</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
